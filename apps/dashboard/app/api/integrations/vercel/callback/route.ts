import { db, eq, user, account, sql, and } from '@databuddy/db';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const code = searchParams.get('code');
		const configurationId = searchParams.get('configurationId');
		const teamId = searchParams.get('teamId');
		const next = searchParams.get('next');

		if (!code) {
			return NextResponse.redirect(
				`${process.env.BETTER_AUTH_URL}/auth/error?error=missing_code`
			);
		}

		const redirectUri = `${process.env.BETTER_AUTH_URL}/api/integrations/vercel/callback`;

		const tokenResponse = await fetch(
			'https://api.vercel.com/v2/oauth/access_token',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					code,
					client_id: process.env.VERCEL_CLIENT_ID as string,
					client_secret: process.env.VERCEL_CLIENT_SECRET as string,
					redirect_uri: redirectUri,
				}),
			}
		);

		if (!tokenResponse.ok) {
			return NextResponse.redirect(
				`${process.env.BETTER_AUTH_URL}/auth/error?error=token_exchange_failed`
			);
		}

		const tokens = await tokenResponse.json();

		const userResponse = await fetch('https://api.vercel.com/v2/user', {
			headers: {
				Authorization: `Bearer ${tokens.access_token}`,
			},
		});

		if (!userResponse.ok) {
			return NextResponse.redirect(
				`${process.env.BETTER_AUTH_URL}/auth/error?error=user_fetch_failed`
			);
		}

		const userResponse_json = await userResponse.json();
		const userInfo = userResponse_json.user;
		
		if (!userInfo.email || !userInfo.id) {
			return NextResponse.redirect(
				`${process.env.BETTER_AUTH_URL}/auth/error?error=invalid_user_info`
			);
		}

		const existingUser = await db.query.user.findFirst({
			where: eq(user.email, userInfo.email),
		});

		let userId: string;

		if (existingUser) {
			userId = existingUser.id;
		} else {
			const newUserId = randomUUID();
			const now = new Date().toISOString();
			
			await db.execute(sql`
				INSERT INTO "user" (
					id, name, email, email_verified, image, created_at, updated_at
				) VALUES (
					${newUserId}, 
					${userInfo.name || userInfo.email}, 
					${userInfo.email}, 
					${true}, 
					${userInfo.avatar || null}, 
					${now}, 
					${now}
				)
			`);
			
			userId = newUserId;
		}


		const existingAccount = await db.query.account.findFirst({
			where: and(
				eq(account.userId, userId),
				eq(account.providerId, 'vercel')
			),
		});

		const now = new Date();
		const accountData = {
			id: existingAccount?.id || randomUUID(),
			accountId: userInfo.id,
			providerId: 'vercel',
			userId: userId,
			accessToken: tokens.access_token,
			scope: JSON.stringify({
				configurationId,
				teamId,
				installationId: tokens.installation_id,
				tokenType: tokens.token_type,
			}),
			createdAt: existingAccount?.createdAt || now.toISOString(),
			updatedAt: now.toISOString(),
		};


		if (existingAccount) {
			await db.execute(sql`
				UPDATE "account" SET
					access_token = ${accountData.accessToken},
					scope = ${accountData.scope},
					updated_at = ${accountData.updatedAt}
				WHERE id = ${existingAccount.id}
			`);
		} else {
			await db.execute(sql`
				INSERT INTO "account" (
					id, account_id, provider_id, user_id, access_token, scope, created_at, updated_at
				) VALUES (
					${accountData.id},
					${accountData.accountId},
					${accountData.providerId},
					${accountData.userId},
					${accountData.accessToken},
					${accountData.scope},
					${accountData.createdAt},
					${accountData.updatedAt}
				)
			`);
		}

		const redirectUrl = next || `${process.env.BETTER_AUTH_URL}/dashboard?vercel_integrated=true`;
		
		return NextResponse.redirect(redirectUrl);
	} catch (error) {
		return NextResponse.redirect(
			`${process.env.BETTER_AUTH_URL}/auth/error?error=internal_error`
		);
	}
}